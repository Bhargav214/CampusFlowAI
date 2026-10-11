import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Login = () => {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        setLoading(true);


        try {

            const data = await login(
                email,
                password
            );


            if (data.role === "admin") {

                navigate("/dashboard");

            } else if (data.role === "faculty") {

                navigate("/dashboard");

            } else {

                navigate("/dashboard");

            }

        } catch (error) {

            setError(
                error.response?.data?.detail ||
                "Login failed"
            );

        } finally {

            setLoading(false);

        }

    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">

            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">

                <h1 className="text-3xl font-bold text-center mb-2">
                    CampusFlow AI
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Sign in to your account
                </p>


                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}


                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>

                        <label className="block mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            className="w-full p-3 border rounded-lg"
                            placeholder="student@campusflow.com"
                            required
                        />

                    </div>


                    <div>

                        <label className="block mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            className="w-full p-3 border rounded-lg"
                            placeholder="••••••••"
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >

                        {loading
                            ? "Signing in..."
                            : "Sign In"
                        }

                    </button>

                </form>

            </div>

        </div>
    );

};


export default Login;