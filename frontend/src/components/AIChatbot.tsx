import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "What types of properties are available?",
  "How does the booking process work?",
  "What are the payment options?",
  "Tell me about construction tracking",
  "How is blockchain used here?",
];

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! 👋 I'm your ApnaGhar AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Property types
    if (lowerMessage.includes("property") || lowerMessage.includes("types")) {
      return "We offer various property types including:\n\n• Residential Apartments (1BHK to 4BHK)\n• Commercial Spaces\n• Villas & Row Houses\n• Plots & Land\n\nAll properties are RERA verified and come with complete transparency. Would you like to explore projects in a specific location?";
    }

    // Booking process
    if (lowerMessage.includes("book") || lowerMessage.includes("purchase")) {
      return "Our booking process is simple and secure:\n\n1. Browse verified properties\n2. Schedule a site visit (optional)\n3. Book online with token amount\n4. Complete documentation\n5. Track construction progress in real-time\n\nAll transactions are blockchain-verified for your security. Ready to explore properties?";
    }

    // Payment options
    if (lowerMessage.includes("payment") || lowerMessage.includes("emi") || lowerMessage.includes("loan")) {
      return "We offer flexible payment options:\n\n• Full payment with attractive discounts\n• Bank loans with pre-approved partnerships\n• Flexible EMI plans\n• Construction-linked payment plans\n\nOur team can help you with loan processing. Would you like to connect with our finance advisor?";
    }

    // Construction tracking
    if (lowerMessage.includes("track") || lowerMessage.includes("progress") || lowerMessage.includes("construction")) {
      return "Our real-time construction tracking features:\n\n• Weekly photo/video updates\n• Geotagged & timestamped media\n• Milestone notifications\n• Progress dashboard\n• Direct builder communication\n\nYou can track every stage of construction from foundation to possession! 🏗️";
    }

    // Blockchain
    if (lowerMessage.includes("blockchain") || lowerMessage.includes("security") || lowerMessage.includes("safe")) {
      return "We use blockchain technology for:\n\n• Immutable booking contracts\n• Verified construction media\n• Transparent payment records\n• Tamper-proof documentation\n• Secure ownership transfer\n\nYour investment is protected with cutting-edge security! 🔐";
    }

    // Location queries
    if (lowerMessage.includes("location") || lowerMessage.includes("where") || lowerMessage.includes("city")) {
      return "We have verified projects across major cities:\n\n• Mumbai & MMR\n• Pune\n• Bangalore\n• Hyderabad\n• Delhi NCR\n• And more!\n\nWhich city are you interested in?";
    }

    // Contact/Support
    if (lowerMessage.includes("contact") || lowerMessage.includes("call") || lowerMessage.includes("support")) {
      return "We're here to help! You can:\n\n• Chat with me 24/7\n• Email: support@apnaghar.com\n• Call: +91-1800-XXX-XXXX\n• Schedule a callback\n\nWhat would you prefer?";
    }

    // Greetings
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return "Hello! 😊 Welcome to ApnaGhar - your trusted real estate partner. I can help you with:\n\n• Finding properties\n• Booking process\n• Payment options\n• Construction tracking\n• Any other queries\n\nWhat would you like to know?";
    }

    // Default response
    return "I'd be happy to help you with that! I can assist you with:\n\n• Property search & details\n• Booking & payment process\n• Construction tracking\n• Blockchain security\n• General inquiries\n\nCould you please provide more details about what you're looking for? Or select a quick question below!";
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(text),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-floating hover:shadow-elevated hover:scale-110 transition-all h-14 w-14 p-0 bg-gradient-to-r from-primary to-accent"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={`shadow-elevated transition-all duration-1000 ease-in-out ${
          isMinimized ? "" : "h-[600px]"
        } w-[380px] flex flex-col overflow-hidden`}
      >
        {/* Header - Always same size */}
        <div className={`bg-gradient-to-r from-primary to-accent text-white p-4 flex items-center justify-between flex-shrink-0 transition-all duration-1000 ease-in-out ${
          isMinimized ? "rounded-lg" : "rounded-t-lg"
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">ApnaGhar AI</h3>
              <p className="text-xs text-white/80">Online • Instant replies</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 text-white hover:bg-white/20"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${
                      message.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "bot"
                          ? "bg-primary/10"
                          : "bg-accent/20"
                      }`}
                    >
                      {message.sender === "bot" ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] ${
                        message.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-3 ${
                          message.sender === "bot"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">
                          {message.text}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl p-3 flex items-center gap-1">
                      <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {/* Quick Questions (show only for first interaction) */}
                {messages.length === 1 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-muted-foreground px-1">
                      Quick questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((question, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Powered by ApnaGhar AI • Always here to help
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIChatbot;
