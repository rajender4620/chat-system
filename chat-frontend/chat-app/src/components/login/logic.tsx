// Import the CSS file so Vite bundles its styles with this component.
// Like importing a theme file in Flutter — the styles become available to use.
import { useState } from "react";
import "./logic.css";
import { useNavigate } from 'react-router-dom'
import { API_URL } from "../../config";

// A "function component" — the modern way to write React UI.
// Flutter analogy: like a StatelessWidget's `build()` method.
// The function RETURNS the UI tree (JSX), same as how `build()` returns a Widget tree.
function Login() {


    const [name, setName] = useState('');
    const navigate = useNavigate()



    return (
        // JSX must return ONE root element. So we wrap everything in a single <div>.
        // Flutter analogy: build() can only return one Widget — same rule here.
        // className = the CSS class name (NOT "class" — that's a reserved word in JS).
        <div className="login-page">
            <div className="login-card">
                {/* <h1> = big heading text. Like a Text widget with large fontSize. */}
                <h1 className="login-title">Welcome back</h1>

                {/* <p> = paragraph text. Like a smaller Text widget. */}
                <p className="login-subtitle">Sign in to continue chatting</p>

                {/* <form> groups inputs together so the browser can handle submit.
                    Flutter analogy: like a Form widget wrapping TextFormFields. */}
                <form className="login-form" onSubmit={

                    async (e) => {
                        e.preventDefault();
                        console.log(name);   // log the captured value, not the event object

                        try {
                            const res = await fetch(`${API_URL}/users`, {
                                method: "POST",
                                headers: {
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify({ name })
                            });
                            if (res.ok) {

                                const json = await res.json();
                                console.log('Backend returned:', json);

                                sessionStorage.setItem('user', JSON.stringify(json.data));

                                navigate('/dashboard')
                            } else {
                                console.log('APi Failed')
                            }

                        } catch (error) {
                            console.log(error)
                            alert('Login failed. Please try again.')
                        }

                    }
                }  >
                    {/* <label> wraps an input so clicking the text focuses the input.
                        Flutter analogy: TextField already has `labelText` built in,
                        but in HTML we build that pairing ourselves. */}
                    <label className="login-label">
                        Name
                        <input
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                            value={name}
                            className="login-input"
                            type="text"                    /* plain text input */
                            placeholder="Enter your name"  /* hint shown when empty (like InputDecoration.hintText) */
                        />
                    </label>

                    {/* type="submit" tells the browser: "when clicked, submit the form".
                        Later you'll add onSubmit={...} to the <form> tag — NOT onClick here.
                        That's the React idiomatic pattern. */}
                    <button className="login-button" type="submit" >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

// "export default" makes this component importable from other files.
// Flutter analogy: similar to making a class public so other files can use it.
export default Login;
