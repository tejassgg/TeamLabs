import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaHistory } from 'react-icons/fa';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';
import { chatbotService } from '../../services/api';
import Link from 'next/link';

import { useRouter } from 'next/router';

const ChatBot = ({ isOpen: externalIsOpen, onToggle: externalOnToggle, showButton = true }) => {
  const router = useRouter();
  const isLandingPage = router.pathname === '/' || router.pathname === '/welcome';
  const [internalIsOpen, setIsInternalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesEndRef = useRef(null);
  const { isAuthenticated } = useGlobal();
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
                className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
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
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Toggle chat"
        >
          {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`absolute bottom-0 right-0 w-96 h-[520px] ${
          theme === 'dark' ? 'bg-[#18181b]' : 'bg-white'
        } rounded-2xl shadow-2xl flex flex-col transition-all duration-300`}>
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <FaRobot size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm tracking-wide truncate">TeamLabs Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-blue-100 font-medium">Always online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAuthenticated && (
                <button
                  onClick={handleHistoryClick}
                  className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white ${showHistory ? 'bg-white/10' : ''}`}
                  title={showHistory ? "Back to chat" : "View conversation history"}
                >
                  <FaHistory size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                title="Minimize chat"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent dark:scrollbar-thumb-gray-800">
            {showHistory ? (
              // Conversation History View
              <div className="space-y-3">
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Past Conversations</h4>
                {conversationHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No history found.</div>
                ) : (
                  conversationHistory.map((conversation, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-[#202024]/40 hover:bg-[#202024]/75 border-gray-800' 
                          : 'bg-gray-50/50 hover:bg-gray-105 border-gray-100'
                      }`}
                      onClick={() => loadPreviousConversation(conversation)}
                    >
                      <div className="text-[10px] font-semibold text-gray-400 mb-1">
                        {new Date(conversation.lastInteraction).toLocaleString()}
                      </div>
                      <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {conversation.messages[0]?.content || 'Empty conversation'}
                      </div>
                    </div>
                  ))
                )}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4 pt-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs font-semibold transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs font-semibold transition-colors"
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
                  <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center mx-auto mb-4">
                      <FaRobot className="text-blue-600 dark:text-blue-400 text-3xl" />
                    </div>
                    <h4 className={`font-semibold mb-1 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hello! I'm your TeamLabs Assistant</h4>
                    <p className="text-xs max-w-[80%] mx-auto mb-6">How can I help you manage your projects or guide your team today?</p>
                    {isLandingPage && (
                      <div className="flex flex-wrap justify-center gap-2">
                        <Link
                          href="/"
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-105 text-blue-600'
                          }`}
                        >
                          Login
                        </Link>
                        <Link
                          href="/auth"
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-105 text-blue-600'
                          }`}
                        >
                          Register
                        </Link>
                        <Link
                          href="/"
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95 ${
                            theme === 'dark'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-105 text-blue-600'
                          }`}
                        >
                          Learn More
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : theme === 'dark' 
                              ? 'bg-gray-800 text-white rounded-tl-none border border-gray-700/60' 
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700/60' : 'bg-gray-100'} rounded-2xl rounded-tl-none px-4 py-3`}>
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
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
            <form onSubmit={handleSubmit} className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} bg-transparent flex-shrink-0`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'bg-[#202024]/60 text-white border-gray-700 placeholder-gray-500 focus:bg-[#1a1a1e]'
                      : 'bg-gray-50 text-gray-800 border-gray-200 placeholder-gray-400 focus:bg-white'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className={`rounded-xl px-4 py-2 flex items-center justify-center transition-all duration-200 ${
                    inputMessage.trim() && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-sm hover:scale-[1.02] transform'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  }`}
                >
                  <FaPaperPlane size={12} />
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