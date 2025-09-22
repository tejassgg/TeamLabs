import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaHistory } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { chatbotService } from '../../services/api';
import Link from 'next/link';

const ChatBot = ({ isOpen: externalIsOpen, onToggle: externalOnToggle, showButton = true }) => {
  const [internalIsOpen, setIsInternalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesEndRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnToggle || setIsInternalOpen;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when authenticated
  useEffect(() => {
    if (isAuthenticated && showHistory) {
      fetchConversationHistory();
    }
  }, [isAuthenticated, showHistory, currentPage]);

  const fetchConversationHistory = async () => {
    try {
      const data = await chatbotService.getConversationHistory(currentPage);
      setConversationHistory(data.conversations);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching conversation history:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const data = await chatbotService.sendMessage(userMessage, isAuthenticated);
      setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
      
      // Refresh conversation history if authenticated
      if (isAuthenticated && showHistory) {
        fetchConversationHistory();
      }
    } catch (error) {
      console.error('Error submitting message:', error.message);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(!showHistory);
    if (!showHistory && isAuthenticated) {
      fetchConversationHistory();
    }
  };

  const loadPreviousConversation = (conversation) => {
    setMessages(conversation.messages);
    setShowHistory(false);
  };

  const renderMessageContent = (content) => {
    if (typeof content === 'string') {
      return content;
    }

    if (content.text && content.links) {
      return (
        <div className="space-y-2">
          <p>{content.text}</p>
          <div className="flex flex-wrap gap-2">
            {content.links.map((link, index) => (
              <Link
                key={index}
                href={link.url}
                className={`inline-block px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                }`}
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return content.text || 'Invalid message format';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Chat Button */}
      {showButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Toggle chat"
        >
          {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-16 right-0 w-96 h-[500px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl flex flex-col border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <FaRobot className="mr-2" />
              <h3 className="font-semibold">TeamLabs Assistant</h3>
            </div>
            {isAuthenticated && (
              <button
                onClick={handleHistoryClick}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                aria-label="View conversation history"
              >
                <FaHistory />
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {showHistory ? (
              // Conversation History View
              <div className="space-y-4">
                {conversationHistory.map((conversation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => loadPreviousConversation(conversation)}
                  >
                    <div className="text-sm text-gray-500">
                      {new Date(conversation.lastInteraction).toLocaleString()}
                    </div>
                    <div className="mt-1 truncate">
                      {conversation.messages[0]?.content || 'Empty conversation'}
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Chat Messages View
              <>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4">
                    <FaRobot className="mx-auto text-4xl mb-2" />
                    <p>Hello! How can I help you today?</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Link
                        href="/"
                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        Login
                      </Link>
                      <Link
                        href="/auth"
                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        Register
                      </Link>
                      <Link
                        href="/"
                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          {!showHistory && (
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBot;