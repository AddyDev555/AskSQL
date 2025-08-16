'use client';
import React from 'react'
import PromptForm from './promptForm'
import Header from './Header'
import Output from './Output'

export default function MainPage() {
    const [prompt, setPrompt] = React.useState("");
    const [dbs, setDbs] = React.useState([]);
    const [geminiMessage, setGeminiMessage] = React.useState("");
    const [dbFilePath, setDbFilePath] = React.useState("");
    const [token, setToken] = React.useState("");
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (!token) {
                const newToken = crypto.randomUUID();
                localStorage.setItem('authToken', newToken);
                setToken(newToken);
            }
            else{
                setToken(token);
            }
        }
    }, [])

    return (
        <div className='w-[90%] m-auto border-l border-r border-indigo-400 min-h-screen'>
            <Header />
            <PromptForm prompt={prompt} setPrompt={setPrompt} setDbs={setDbs} setGeminiMessage={setGeminiMessage} setDbFilePath={setDbFilePath} token={token} />
            <Output prompt={prompt} dbs={dbs} geminiMessage={geminiMessage} dbFilePath={dbFilePath} token={token} />
        </div>
    )
}
