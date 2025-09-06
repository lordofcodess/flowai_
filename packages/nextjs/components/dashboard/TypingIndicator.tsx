const TypingIndicator = () => {
  return (
    <div className="flex justify-start p-2 md:p-3">
      <div className="max-w-[85%]">
        {/* Typing Bubble */}
        <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
