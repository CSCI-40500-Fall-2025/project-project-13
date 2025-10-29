# tests/test_auth_tokens.py
import os
import importlib
from datetime import timedelta
import pytest

TEST_RSA_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgHrXUt6UjkGH6zMaMFvBhgBLQBIT1UctSAdKQPCCTqB9q6PHGpWZ
JBR2A/0SQ83J21lHxzloCycNFnlID1aDpLVagWRm/oTfswE9VmUbMrGlG3FK6yFG
WVAGYytroqIodtcav64Mwk3Zz6h+R0LYniOUBCTqpka/DUmTGPo4lrWDAgMBAAEC
gYBAGCeaEWMkWBnlgQ2oYpJbhuf4Rrbqu3qwqxK1KxiBbvDmtJVvZwdHUciE/Em6
j09PBz+w+VOQXajTQUEXf/qpD7Ue0uCKOo0DC7gK53qVEQ9GSIr15qNgiEJdjHCU
IE6VPJkF7b50u5VvZ3raCwwRVxYT50AJEKg2Rbg2OTc5uQJBAPDRxkdHttOCpz5F
xWn608Wb/R9sv/zw5wfRZntoSjWxYlUZbshIPsxtZtUeOd3zpphbPN3zWV9euVsU
dcNLSi8CQQCClaxNpBDAXTLUQbFmvyK+aZ7jm1HFMdMxWdba4CKA1FAOmmg2d3rZ
h/7zDq+uZoIUhtfS7wqQ2dnGITiSc3jtAkBgVfq0vxqDKEwRHEYp7D5VWd57eLyg
yhoRxZHyoji1m/1TP7ZShpwgmU8+yDWr9XFal30U6OmCvlj194xYkMDfAkBL3ybT
naXV/tCPnvOyHQ/Uzo1w9UeXaZGptOcvGNczPyics34lV1pblba+BiRxEkI2Jvqz
JgxfiRQNGDREcy8pAkAx9+CYp1zZHAB8GMzeQGULzQ7m67P0p3c0AuGdEgry09ht
WGSMP/EAiedpijQZU1FFtTlgOLJv1oyhNlitbuBH
-----END RSA PRIVATE KEY-----"""

TEST_RSA_PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgHrXUt6UjkGH6zMaMFvBhgBLQBIT
1UctSAdKQPCCTqB9q6PHGpWZJBR2A/0SQ83J21lHxzloCycNFnlID1aDpLVagWRm
/oTfswE9VmUbMrGlG3FK6yFGWVAGYytroqIodtcav64Mwk3Zz6h+R0LYniOUBCTq
pka/DUmTGPo4lrWDAgMBAAE=
-----END PUBLIC KEY-----"""

# Put same keys into previous and latest env vars
os.environ["JWT_PRIVATE_KEY_LATEST"] = TEST_RSA_PRIVATE_KEY
os.environ["JWT_PUBLIC_KEY_LATEST"] = TEST_RSA_PUBLIC_KEY
os.environ["JWT_PRIVATE_KEY_PREVIOUS"] = TEST_RSA_PRIVATE_KEY
os.environ["JWT_PUBLIC_KEY_PREVIOUS"] = TEST_RSA_PUBLIC_KEY

from ..app.routes.auth.logic import create_jwt, decode_jwt, hashify, verify, update_headers, create_new_tokens

# starlette Response for header tests
from starlette.responses import Response
from fastapi import HTTPException


class TestAuthLogic:
    def test_hashify_and_verify_success_and_failure(self):
        pwd = "super-secret-password"
        hashed = hashify(pwd)
        assert isinstance(hashed, str)
        assert verify(pwd, hashed) is True
        assert verify("wrong-password", hashed) is False

    def test_create_jwt_and_decode_jwt_roundtrip(self):
        # create an access token with a subject
        token = create_jwt(payload={"sub": "123"}, token_type="access", expires_delta=timedelta(minutes=5))
        assert isinstance(token, str)
        payload = decode_jwt(token, expected_type="access")
        assert payload.get("type") == "access"
        assert str(payload.get("sub")) == "123"

    def test_decode_jwt_wrong_type_raises(self):
        token = create_jwt(payload={"sub": "321"}, token_type="access", expires_delta=timedelta(minutes=5))
        with pytest.raises(HTTPException) as exc:
            decode_jwt(token, expected_type="refresh")
        assert exc.value.status_code == 401

    def test_update_headers_sets_three_cookies(self):
        resp = Response(content=b"ok")
        tokens = {"access_token": "a-token", "refresh_token": "r-token", "user_id": 999}
        new_resp = update_headers(resp, tokens)

        set_cookie_headers = new_resp.raw_headers
        set_cookie_values = [v.decode() for (k, v) in set_cookie_headers if k.decode().lower() == "set-cookie"]

        assert any("Authorization=" in v for v in set_cookie_values)
        assert any("X-Refresh-Token=" in v for v in set_cookie_values)
        assert any("X-User-ID=" in v for v in set_cookie_values)
        assert len(set_cookie_values) == 3

    def test_create_new_tokens_produces_access_and_refresh_and_decode(self):
        access, refresh = create_new_tokens(42)
        assert isinstance(access, str) and isinstance(refresh, str)

        # decode both tokens
        a_payload = decode_jwt(access, expected_type="access")
        r_payload = decode_jwt(refresh, expected_type="refresh")
        assert a_payload.get("type") == "access"
        assert r_payload.get("type") == "refresh"
        assert a_payload.get("sub") == "42"
        assert r_payload.get("sub") == "42"
