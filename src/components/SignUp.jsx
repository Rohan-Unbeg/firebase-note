import React, { useState } from "react";
import { signUpWithEmail } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSignUp = async () => {
        try {
            await signUpWithEmail(email, password);
            alert("Signed Up! Log in now");
            navigate("/login");
        } catch (error) {
            alert("Signed Up failed! Try again later");
            console.log(error);
        }
    };
    return (
        <div className="flex min-h-screen justify-center items-center">
            <div className="flex flex-col gap-3 px-4 w-[350px] ">
                <h1 className="text-4xl  text-center font-bold my-2  ">Create an Account</h1>
                <input
                    className="border-1 rounded-lg p-2"
                    type="email"
                    placeholder="Your Email..."
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="border-1 rounded-lg p-2"
                    type="password"
                    placeholder="Your Password..."
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="bg-blue-500 rounded-lg text-white  p-2"
                    onClick={handleSignUp}
                >
                    Sign Up
                </button>

                <div>
                    <p className="text-center text-md">
                        Already have an account?{" "}
                        <a className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600 font-bold" href="/login">
                            Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
