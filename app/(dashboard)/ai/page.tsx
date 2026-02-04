import { ChatInterface } from "@/components/ai/chat-interface";

export default function AIPage() {
    return (
        <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 max-h-screen">
            <div className="flex-1 w-full">
                <ChatInterface />
            </div>
        </div>
    );
}
