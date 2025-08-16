"use client";
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Forward, Loader2, AlertCircle } from 'lucide-react';
import KeyIcon from '@/components/ui/keyicon';

export default function PromptForm({ 
    prompt, 
    setPrompt, 
    setDbs, 
    setGeminiMessage, 
    setDbFilePath, 
    token,
    onProcessingChange = null 
}) {
    const inputRef = React.useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const processPrompt = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate schema');
            return;
        }

        setIsProcessing(true);
        setError('');
        
        // Notify parent component about processing state
        if (onProcessingChange) {
            onProcessingChange(true);
        }

        try {
            const response = await fetch(`${apiUrl}/process_prompt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt, token }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success - update all state
                setDbs(data.data.db_structure);
                setGeminiMessage(data.data.gemini_message);
                setDbFilePath(data.data.db_file_path);
                
                console.log("Prompt processed successfully:", {
                    schema: data.data.db_structure,
                    message: data.data.gemini_message,
                    filePath: data.data.db_file_path
                });
                
                // Clear form
                setPrompt("");
                inputRef.current?.blur();
                setError('');
            } else {
                // Handle API errors
                const errorMessage = data.error || 'Failed to process prompt';
                setError(errorMessage);
                console.error("Error processing prompt:", errorMessage);
            }
        } catch (error) {
            // Handle network or other errors
            const errorMessage = error.message || 'Network error occurred';
            setError(`Connection error: ${errorMessage}`);
            console.error("Error:", error);
        } finally {
            setIsProcessing(false);
            if (onProcessingChange) {
                onProcessingChange(false);
            }
        }
    };

    const sendPrompt = (e) => {
        e.preventDefault();
        if (!isProcessing) {
            processPrompt();
        }
    };

    // Clear error when user starts typing
    const handleInputChange = (e) => {
        setPrompt(e.target.value);
        if (error) {
            setError('');
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] md:w-[40%]">
            {/* Error Message */}
            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            {/* Processing Indicator */}
            {isProcessing && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <p className="text-sm">Generating database schema...</p>
                </div>
            )}

            <form className="w-full" onSubmit={sendPrompt}>
                <div className="flex items-center space-x-2">
                    <div className="flex relative left-13.5 items-center space-x-0.5 border rounded pr-1.5 border-white bg-white/10 backdrop-blur-sm">
                        <KeyIcon />
                        <span className="text-sm pt-0.5 text-white">K</span>
                    </div>
                    <Input
                        ref={inputRef}
                        placeholder={isProcessing ? "Processing..." : "Describe your database schema..."}
                        value={prompt}
                        onChange={handleInputChange}
                        disabled={isProcessing}
                        className={`bg-transparent hover:border-white focus:border-white pl-14 border pr-10 transition-all duration-200 ${
                            error ? 'border-red-400 focus:border-red-400' : 'border-white'
                        } ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    />
                    <Button 
                        type="submit" 
                        onClick={sendPrompt} 
                        disabled={isProcessing || !prompt.trim()}
                        className={`cursor-pointer z-1000 relative right-12 bottom-0.5 transition-all duration-200 ${
                            isProcessing ? 'opacity-75' : 'hover:scale-105'
                        }`}
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Forward />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}