from app.core.security import hash_password, validate_password_strength, verify_password


class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password_returns_different_hash(self):
        """Test that hashing the same password twice returns different hashes."""
        password = "TestPassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2

    def test_hash_password_returns_argon2_hash(self):
        """Test that hash_password returns Argon2 hash."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert hashed.startswith("$argon2")

    def test_verify_password_correct(self):
        """Test that verify_password returns True for correct password."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test that verify_password returns False for incorrect password."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert verify_password("WrongPassword123!", hashed) is False

    def test_verify_password_empty_string(self):
        """Test that verify_password returns False for empty password."""
        password = "TestPassword123!"
        hashed = hash_password(password)
        assert verify_password("", hashed) is False


class TestPasswordStrength:
    """Test password strength validation."""

    def test_valid_password(self):
        """Test that valid password passes validation."""
        is_valid, error = validate_password_strength("Test@123")
        assert is_valid is True
        assert error is None

    def test_password_too_short(self):
        """Test that short password fails validation."""
        is_valid, error = validate_password_strength("Test@1")
        assert is_valid is False
        assert "at least 8 characters" in error

    def test_password_no_uppercase(self):
        """Test that password without uppercase fails validation."""
        is_valid, error = validate_password_strength("test@123")
        assert is_valid is False
        assert "uppercase letter" in error

    def test_password_no_number(self):
        """Test that password without number fails validation."""
        is_valid, error = validate_password_strength("Test@abc")
        assert is_valid is False
        assert "number" in error

    def test_password_no_special(self):
        """Test that password without special character fails validation."""
        is_valid, error = validate_password_strength("Test1234")
        assert is_valid is False
        assert "special character" in error

    def test_password_various_special_chars(self):
        """Test that various special characters are accepted."""
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        for char in special_chars:
            password = f"Test123{char}"
            is_valid, error = validate_password_strength(password)
            assert is_valid is True, f"Failed for special char: {char}"
            assert error is None

    def test_password_exactly_8_chars(self):
        """Test that password with exactly 8 characters passes."""
        is_valid, error = validate_password_strength("Test@123")
        assert is_valid is True
        assert error is None

    def test_password_long(self):
        """Test that long password passes validation."""
        is_valid, error = validate_password_strength("Test@123" * 10)
        assert is_valid is True
        assert error is None
