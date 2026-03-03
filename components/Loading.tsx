
import React from 'react';

const Loading: React.FC<{ message: string }> = ({ message }) => {
    const messages = [
        "Kuch creative ideas taiyaar ho rahe hain...",
        "AI guru se salah li jaa rahi hai...",
        "Aapka learning path ban raha hai...",
        "Bas ek pal, kuch badhiya aane wala hai!",
    ];

    const [loadingMessage, setLoadingMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 3000);

        return () => clearInterval(intervalId);
    }, [messages]);


  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[50vh]">
      <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold text-brand-text mb-2">{message}</h2>
      <p className="text-brand-text-secondary transition-opacity duration-500">{loadingMessage}</p>
    </div>
  );
};

export default Loading;
