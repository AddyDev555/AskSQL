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
    const token = localStorage.getItem('authToken');

    React.useEffect(()=>{
        if (!token) {
            const newToken = crypto.randomUUID();
            localStorage.setItem('authToken', newToken);
        }
    },[])

    return (
        <div className='w-[90%] m-auto border-l border-r border-indigo-400 min-h-screen'>
            <Header />
            <PromptForm prompt={prompt} setPrompt={setPrompt} setDbs={setDbs} setGeminiMessage={setGeminiMessage} setDbFilePath={setDbFilePath} token={token}/>
            <Output prompt={prompt} dbs={dbs} geminiMessage={geminiMessage} dbFilePath={dbFilePath} token={token}/>
        </div>
    )
}
