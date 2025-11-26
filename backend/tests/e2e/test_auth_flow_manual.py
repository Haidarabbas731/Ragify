"""Test authentication flow end-to-end."""
import asyncio
import time

import httpx

BASE_URL = "http://127.0.0.1:8000"


async def test_auth_flow():
    """Test complete authentication flow."""
    print("=" * 60)
    print("Testing Complete Authentication Flow")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        # Test 1: Register new user (Skip in invite-only mode)
        print("\n[1] Testing Registration...")
        test_email = f"testuser_{int(time.time())}@example.com"
        test_password = "TestPass123!"
        user_registered = False

        try:
            register_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/register",
                json={"email": test_email, "password": test_password},
            )

            if register_resp.status_code == 201:
                print(f"   [SUCCESS] User registered - {test_email}")
                user_data = register_resp.json()
                user_id = user_data.get("user_id")
                print(f"   User ID: {user_id}")
                user_registered = True
            elif register_resp.status_code == 400 and "Invite code" in register_resp.text:
                print("   [SKIPPED] System in invite-only mode, using existing test user")
                # Use existing test user credentials
                test_email = "user@example.com"
                test_password = "User@1234"
            else:
                print(f"   [FAILED] {register_resp.status_code} - {register_resp.text}")
                return
        except Exception as e:
            print(f"   [ERROR] {e}")
            return

        # Test 2: Login with new user
        print("\n[2] Testing Login...")
        try:
            login_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={"email": test_email, "password": test_password},
            )

            if login_resp.status_code == 200:
                print("   [SUCCESS] Login successful")
                tokens = login_resp.json()
                access_token = tokens.get("access_token")
                refresh_token = tokens.get("refresh_token")
                print(f"   Access token length: {len(access_token)}")
                print(f"   Refresh token length: {len(refresh_token)}")
            else:
                print(f"   [FAILED] {login_resp.status_code} - {login_resp.text}")
                return
        except Exception as e:
            print(f"   [ERROR] {e}")
            return

        # Test 3: Access protected endpoint
        print("\n[3] Testing Protected Endpoint Access...")
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            docs_resp = await client.get(f"{BASE_URL}/api/v1/documents", headers=headers)

            if docs_resp.status_code == 200:
                print("   [SUCCESS] Protected endpoint accessible")
                data = docs_resp.json()
                print(f"   Documents count: {data.get('total', 0)}")
            else:
                print(f"   [FAILED] {docs_resp.status_code} - {docs_resp.text}")
        except Exception as e:
            print(f"   [ERROR] {e}")

        # Test 4: Refresh token
        print("\n[4] Testing Token Refresh...")
        try:
            refresh_headers = {"Authorization": f"Bearer {refresh_token}"}
            refresh_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/refresh", headers=refresh_headers
            )

            if refresh_resp.status_code == 200:
                print("   [SUCCESS] Token refreshed")
                new_tokens = refresh_resp.json()
                new_access_token = new_tokens.get("access_token")
                new_refresh_token = new_tokens.get("refresh_token")
                print(f"   New access token length: {len(new_access_token)}")
                # Update tokens for next tests
                access_token = new_access_token
                refresh_token = new_refresh_token
            else:
                print(f"   [FAILED] {refresh_resp.status_code} - {refresh_resp.text}")
        except Exception as e:
            print(f"   [ERROR] {e}")

        # Test 5: Logout
        print("\n[5] Testing Logout...")
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            logout_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/logout", headers=headers
            )

            if logout_resp.status_code == 200:
                print("   [SUCCESS] Logged out successfully")
            else:
                print(f"   [FAILED] {logout_resp.status_code} - {logout_resp.text}")
        except Exception as e:
            print(f"   [ERROR] {e}")

        # Test 6: Try to use old token (should fail)
        print("\n[6] Testing Old Token After Logout...")
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            test_resp = await client.get(f"{BASE_URL}/api/v1/documents", headers=headers)

            if test_resp.status_code == 403:
                print("   [SUCCESS] Old token rejected (as expected)")
            else:
                print(f"   [FAILED] Token still works! Status: {test_resp.status_code}")
        except Exception as e:
            print(f"   [ERROR] {e}")

        # Test 7: Login again (should work)
        print("\n[7] Testing Login After Logout...")
        try:
            login2_resp = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={"email": test_email, "password": test_password},
            )

            if login2_resp.status_code == 200:
                print("   [SUCCESS] Can login again after logout")
                tokens2 = login2_resp.json()
                access_token = tokens2.get("access_token")
            else:
                print(f"   [FAILED] {login2_resp.status_code} - {login2_resp.text}")
                return
        except Exception as e:
            print(f"   [ERROR] {e}")
            return

        # Test 8: Password reset request (skip if using existing user)
        print("\n[8] Testing Password Reset Request...")
        if user_registered:
            try:
                reset_req_resp = await client.post(
                    f"{BASE_URL}/api/v1/auth/password-reset/request",
                    json={"email": test_email},
                )

                if reset_req_resp.status_code == 200:
                    print("   [SUCCESS] Password reset requested")
                    print("   Note: Check server logs for reset token")
                else:
                    print(f"   [FAILED] {reset_req_resp.status_code} - {reset_req_resp.text}")
            except Exception as e:
                print(f"   [ERROR] {e}")
        else:
            print("   [SKIPPED] Using existing test user, not testing password reset")

        # Test 9: Test with existing admin user
        print("\n[9] Testing With Admin Account...")
        try:
            admin_login = await client.post(
                f"{BASE_URL}/api/v1/auth/login",
                json={"email": "admin@test.com", "password": "Admin@1234"},
            )

            if admin_login.status_code == 200:
                print("   [SUCCESS] Admin login works")
                admin_tokens = admin_login.json()

                # Test admin logout
                admin_logout = await client.post(
                    f"{BASE_URL}/api/v1/auth/logout",
                    headers={"Authorization": f"Bearer {admin_tokens['access_token']}"},
                )

                if admin_logout.status_code == 200:
                    print("   [SUCCESS] Admin logout works")

                # Test admin can login again
                admin_login2 = await client.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json={"email": "admin@test.com", "password": "Admin@1234"},
                )

                if admin_login2.status_code == 200:
                    print("   [SUCCESS] Admin can login again after logout")
                else:
                    print("   [FAILED] Admin cannot login after logout!")
            else:
                print(f"   [FAILED] Admin login failed - {admin_login.status_code}")
        except Exception as e:
            print(f"   [ERROR] {e}")

        # Test 10: Test with regular user (only if we registered a new user)
        if user_registered:
            print("\n[10] Testing With Regular User Account (user@example.com)...")
            try:
                user_login = await client.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json={"email": "user@example.com", "password": "User@1234"},
                )

                if user_login.status_code == 200:
                    print("   [SUCCESS] User login works")
                    user_tokens = user_login.json()

                    # Test user logout
                    user_logout = await client.post(
                        f"{BASE_URL}/api/v1/auth/logout",
                        headers={"Authorization": f"Bearer {user_tokens['access_token']}"},
                    )

                    if user_logout.status_code == 200:
                        print("   [SUCCESS] User logout works")

                    # Test user can login again
                    user_login2 = await client.post(
                        f"{BASE_URL}/api/v1/auth/login",
                        json={"email": "user@example.com", "password": "User@1234"},
                    )

                    if user_login2.status_code == 200:
                        print("   [SUCCESS] User can login again after logout")
                    else:
                        print("   [FAILED] User cannot login after logout!")
                else:
                    print(f"   [FAILED] User login failed - {user_login.status_code}")
            except Exception as e:
                print(f"   [ERROR] {e}")
        else:
            print("\n[10] [SKIPPED] Already tested with user@example.com in tests 1-7")

        print("\n" + "=" * 60)
        print("Authentication Flow Test Complete")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_auth_flow())
