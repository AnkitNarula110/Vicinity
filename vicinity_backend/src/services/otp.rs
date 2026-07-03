//OTP service

// Import the random number generator trait
use rand::Rng;

/// Generate a 6-digit one-time password
///
/// # Returns
/// * `String` - A 6-digit OTP as a string (e.g., "123456")
///
pub fn generateOtp() -> String {
    // Create a thread-local random number generator
    // thread_rng() is fast and cryptographically secure
    let mut rng = rand::thread_rng();

    // Generate a random number between 100,000 and 999,999
    // gen_range is inclusive on lower bound, exclusive on upper bound
    let otpNumber = rng.gen_range(100000..999999);

    // Convert the number to a string and return it
    otp_number.to_string()
}

/// Hash an OTP for secure storage
///
/// # Arguments
/// * `otp` - The raw OTP string
///
/// # Returns
/// * `String` - Hashed OTP
///
/// # Note
/// In production, use Argon2 or bcrypt for actual hashing
/// This is a placeholder for demonstration purposes
pub fn hash_otp(otp: &str) -> String {
    // Simple hash - prefix the OTP with "hash_"
    // This is NOT secure for production!
    // Use argon2::hash_password() in real applications
    format!("hash_{}", otp)
}

/// Verify an OTP against its stored hash
///
/// # Arguments
/// * `input_otp` - The OTP provided by the user
/// * `stored_hash` - The hash stored in the database
///
/// # Returns
/// * `bool` - true if the OTP matches, false otherwise
pub fn verify_otp(input_otp: &str, stored_hash: &str) -> bool {
    // Hash the input OTP using the same method as when storing
    let expected = format!("hash_{}", input_otp);

    // Compare the hashes
    // In production, use constant-time comparison to prevent timing attacks
    expected == stored_hash
}
