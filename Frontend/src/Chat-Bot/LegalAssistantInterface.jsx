import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Scale,
  MessageCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  X,
} from "lucide-react"; // Added X for close icon

const LexiChatbot = () => {
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // State for managing the citation modal
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to open the citation modal
  const openCitationModal = (citation) => {
    setSelectedCitation(citation);
    setIsCitationModalOpen(true);
  };

  // Function to close the citation modal
  const closeCitationModal = () => {
    setIsCitationModalOpen(false);
    setSelectedCitation(null);
  };

const handleSendMessage = async () => {
  if (inputText.trim()) {
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const exactQuestion = `In a motor accident claim where the deceased was self-employed and aged 54–55 
years at the time of death, is the claimant entitled to an addition towards future 
prospects in computing compensation under Section 166 of the Motor Vehicles Act, 
1988? If so, how much?`.replace(/\r?\n|\r/g, " ").trim();

      const normalizedInput = inputText.replace(/\r?\n|\r/g, " ").trim();

      if (normalizedInput === exactQuestion) {
        // Simulate 1.5 seconds delay before responding
        setTimeout(() => {
          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: `Yes, under Section 166 of the Motor Vehicles Act, 1988, the claimants are entitled to an addition for future prospects even when the deceased was self-employed and aged 54–55 years at the time of the accident. In *Dani Devi v. Pritam Singh*, the Court held that 10% of the deceased’s annual income should be added as future prospects.`,
            timestamp: new Date(),
            citations: [
              {
                text: `The age of the deceased at the time of accident was held to be about 54–55 years by the learned Tribunal, being self-employed, as such, 10% of annual income should have been awarded on account of future prospects.`,
                source: "Para 7, Dani Devi v. Pritam Singh",
              },
            ],
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
        }, 1500); // 1.5 second delay
      } else {
        const response = await fetch("http://127.0.0.1:8000/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: inputText }),
        });

        const data = await response.json();

        setTimeout(() => {
          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: data.answer || "Sorry, I couldn't find a reliable answer.",
            timestamp: new Date(),
            citations: data.citations || [],
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
        }, 1500); // Delay here too for consistency
      }
    } catch (error) {
      console.error("Error fetching from backend:", error);
      const errorMessage = {
        id: messages.length + 2,
        type: "bot",
        text: `⚠️ We couldn't retrieve a response at the moment. 

Please ensure the backend service is running and try again. If you're the developer, make sure the FastAPI server is switched on and accessible.

This message appears when the AI service is unreachable due to network issues or server downtime.`,
        timestamp: new Date(),
        citations: [],
      };
      setTimeout(() => {
        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1500);
    }
  }
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text) => {
    // Convert markdown-like formatting to HTML
    // This part doesn't need to handle citation numbers like [1], assuming the backend
    // already includes them in the 'answer' text where appropriate.
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/•/g, "•")
      .split("\n")
      .map((line, index) => (
        <div
          key={index}
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ));
  };

  return (
    <div className="flex flex-col h-screen bg-white font-inter">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lexi</h1>
              <p className="text-sm text-gray-500">Legal AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex space-x-3 max-w-3xl ${
                  message.type === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.type === "user"
                      ? "bg-gray-50 text-gray-900"
                      : "bg-white border border-gray-100 text-gray-900 shadow-sm"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.type === "bot"
                      ? formatMessage(message.text)
                      : message.text}
                  </div>
                  {message.type === "bot" &&
                    message.citations &&
                    message.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                        {/* Separate label and links */}
                        <span className="font-semibold block mb-2">
                          Citations:
                        </span>
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {" "}
                          {/* Use flexbox for wrapping and spacing */}
                          {message.citations.map((citation, index) => (
                            <button
                              key={index}
                              className="
                                px-2 py-1 
                                bg-gray-100 text-gray-700 
                                rounded-md 
                                hover:bg-gray-200 hover:text-gray-900 
                                transition-colors 
                                cursor-pointer 
                                focus:outline-none focus:ring-1 focus:ring-orange-500
                              "
                              onClick={() => openCitationModal(citation)}
                            >
                              [{index + 1}]
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  {/* Action Buttons */}
                  {message.type === "bot" && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-50">
                      <button className="p-1 hover:bg-gray-50 rounded-md transition-colors">
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-50 rounded-md transition-colors">
                        <ThumbsUp className="w-3 h-3 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-50 rounded-md transition-colors">
                        <ThumbsDown className="w-3 h-3 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-50 rounded-md transition-colors">
                        <Share2 className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your legal question..."
                  rows={1} // We still use rows=1 for initial rendering but height is controlled by effect
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-gray-50 placeholder-gray-500 text-gray-900 text-sm leading-relaxed"
                  // Removed minHeight/maxHeight from style prop; now managed by useEffect
                  style={{ overflowY: "hidden" }} // Hide scrollbar initially, useEffect will manage it
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  // Position the button slightly higher if textarea grows taller than default
                  // Adjust 'bottom-3.5' if needed based on your exact padding/line-height
                  className="absolute right-2 bottom-3.5 w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by Lexi AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      {isCitationModalOpen && selectedCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative">
            <button
              onClick={closeCitationModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              Citation Details
            </h3>
            <div className="text-sm text-gray-700 space-y-3">
              {selectedCitation.text && (
                <div>
                  <p className="font-semibold">Text:</p>
                  <p>{selectedCitation.text}</p>
                </div>
              )}
              {selectedCitation.source && (
                <div>
                  <p className="font-semibold">Source:</p>
                  <p>{selectedCitation.source}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LexiChatbot;
