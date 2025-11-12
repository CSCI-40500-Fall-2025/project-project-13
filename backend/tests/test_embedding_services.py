import importlib
import numpy as np
import pytest

from ..app.services.embedding import chunk_text, cosine_similarity, reconstruct_text

class TestCosineAndChunking:
    
    def test_cosine_similarity_identical_embeddings(self):
        """Same direction (one is scalar multiple) -> cosine = 1.0"""
        a = np.array([1.0, 2.0, 3.0, 4.0])
        b = np.array([2.0, 4.0, 6.0, 8.0])  # exactly same direction, scaled
        assert cosine_similarity(a, b) == pytest.approx(1.0)

    def test_cosine_similarity_totally_different_embeddings(self):
        """Orthogonal vectors should give cosine near 0.0"""
        a = np.array([1.0, 0.0, 0.0])
        b = np.array([0.0, 1.0, 0.0])  # orthogonal
        assert cosine_similarity(a, b) == pytest.approx(0.0)

    def test_cosine_similarity_slightly_different_embeddings(self):

        v1 = np.array([1.0, 0.0, 0.0])
       
        v2 = np.array([0.8, 0.6, 0.0])
        assert cosine_similarity(v1, v2) != pytest.approx(0.8, rel=1e-6)

    def test_chunk_and_reconstruct_with_weird_structure(self):
        
        weird = (
            "Paragraph one—starts here!\n\n"
            "Then a line with many... ellipses... and punctuation?!\n\n"
            "    Indented line with   multiple   spaces.\n"
            "Unicode: café, naïve, 中文, emoji: 🚀🔥\n\n"
            "Trailing separators...\n\n"
        )
        chunks = chunk_text(weird)
      
        assert isinstance(chunks, list)
        assert all(isinstance(c, dict) for c in chunks)
       
        reconstructed = reconstruct_text([c["text"] for c in chunks])
        assert reconstructed == weird

    def test_chunk_indices_monotonic_and_cover_text(self):
        """
        Ensure start/end indices are monotonic, non-overlapping, start at 0 and end at len(text).
        This is important for downstream retrieval that relies on positions.
        """
        text = (
            "First paragraph.\n\n"
            "Second paragraph with more content. Sentence two. Sentence three!\n\n"
            "Third paragraph — short.\n"
        )
        chunks = chunk_text(text)
        assert len(chunks) >= 1

        # Check first start is 0 and final end equals text length
        assert chunks[0]["start"] == 0
        assert chunks[-1]["end"] == len(text)

        # Check monotonicity and non-overlap
        for i in range(len(chunks)):
            s = chunks[i]["start"]
            e = chunks[i]["end"]
            assert isinstance(s, int) and isinstance(e, int)
            assert 0 <= s < e <= len(text)
            if i > 0:
                prev = chunks[i - 1]
                assert s == prev["end"]

    def test_reconstruct_text_with_manual_fragments(self):
        """
        Provide manually-created chunk fragments (including punctuation and whitespace)
        and verify reconstruct_text simply concatenates them in order.
        """
        parts = [
            "Hello, ",
            "this is a test. ",
            "\n\nNew paragraph — with emoji 🚀.",
            " End."
        ]
        assert reconstruct_text(parts) == "Hello, this is a test. \n\nNew paragraph — with emoji 🚀. End."
