import React, { useState } from "react";
import { loginWithEmail, loginWithGoogle } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleEmailLogin = async () => {
        try {
            await loginWithEmail(email, password);
            navigate("/");
        } catch (error) {
            alert("Login failed! Check Credentials");
            console.log(error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle()
            navigate("/")
        }catch(error)
        {
            alert('Google Login failed!')
            console.log(error)
        }
    };
    return (
        <div className="flex min-h-screen justify-center items-center">
            <div className="flex flex-col gap-3 px-4 w-[350px]">
                <h1 className="text-4xl text-center font-bold my-2">Login</h1>
                <input
                    className="border rounded-lg p-2"
                    type="email"
                    placeholder="Your Email..."
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="border rounded-lg p-2"
                    type="password"
                    placeholder="Your Password..."
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    className="bg-blue-500 rounded-lg text-white p-2"
                    onClick={handleEmailLogin}
                >
                    Login
                </button>
                <button
                    className="bg-blue-500 rounded-lg text-white p-2"
                    onClick={handleGoogleLogin}
                >
                    Continue with Google
                </button>
                <div>
                    <p className="text-center text-md">
                        Don’t have an account?{" "}
                        <a
                            className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600 font-bold"
                            href="/signup"
                        >
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
