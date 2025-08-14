import React from 'react'
import MainPage from './components/MainPage'

export const metadata = {
    title: 'AskSQL',
    description: 'Welcome to the home page',
}

export default function page() {
    return (
        <div>
            <MainPage />
        </div>
    )
}
