import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { User, ChatRoom, Ad } from '../types';

interface MyChatsProps {
  currentUser: User;
  onAdClick: (id: string) => void;
}

const MyChats: React.FC<MyChatsProps> = ({ currentUser, onAdClick }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const myChats = await api.getUserChats(currentUser.id);
      setChatRooms(myChats);
      setLoading(false);
    };
    fetchChats();
  }, [currentUser.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoom?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRoom) return;

    // Use efficient getAd instead of fetching all ads
    const ad = await api.getAd(selectedRoom.adId);
    if (!ad) return;

    // Buyer info is also needed for new room creation, but here we already have room
    const buyer: User = { id: selectedRoom.buyerId, name: selectedRoom.buyerName, phone: '', role: 'USER', createdAt: '' };

    const updatedRoom = await api.sendMessage(selectedRoom.id, ad, buyer, message);
    setSelectedRoom(updatedRoom);
    setChatRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    setMessage('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-8 text-right underline underline-offset-8 decoration-brand-green">رسائلي</h1>

      {chatRooms.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-comments text-4xl"></i>
          </div>
          <p className="text-gray-500 font-bold">لا توجد محادثات نشطة حالياً</p>
          <p className="text-gray-400 text-sm mt-2">تصفح الإعلانات وتواصل مع البائعين لبدء المحادثة</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-lg overflow-hidden flex flex-col md:flex-row h-[70vh]">
          {/* List of Chats */}
          <div className="w-full md:w-1/3 border-l overflow-y-auto bg-gray-50">
            {chatRooms.map(room => {
              const isBuyer = room.buyerId === currentUser.id;
              const otherParty = isBuyer ? room.sellerName : room.buyerName;
              const lastMsg = room.messages[room.messages.length - 1];
              
              return (
                <div 
                  key={room.id}
                  onClick={async () => {
                    const messages = await api.getChatRoomMessages(room.id);
                    setSelectedRoom({ ...room, messages });
                  }}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-white ${selectedRoom?.id === room.id ? 'bg-white border-r-4 border-r-brand-green border-l-0' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800">{otherParty}</span>
                    <span className="text-[10px] text-gray-400">{new Date(room.lastUpdated).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="text-xs text-brand-green font-bold mb-1 truncate">{room.adTitle}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{lastMsg?.text}</div>
                </div>
              );
            })}
          </div>

          {/* Chat Window */}
          <div className="flex-grow flex flex-col bg-white">
            {selectedRoom ? (
              <>
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-green text-black rounded-full flex items-center justify-center font-bold">
                        {(selectedRoom.buyerId === currentUser.id ? selectedRoom.sellerName : selectedRoom.buyerName).charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-sm">{selectedRoom.buyerId === currentUser.id ? selectedRoom.sellerName : selectedRoom.buyerName}</div>
                        <button 
                            onClick={() => onAdClick(selectedRoom.adId)}
                            className="text-[10px] text-brand-green hover:underline font-bold"
                        >
                            بخصوص: {selectedRoom.adTitle}
                        </button>
                    </div>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {selectedRoom.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-brand-green text-black rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <input 
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-grow px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-green text-sm"
                  />
                  <button 
                    type="submit"
                    className="bg-brand-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-900 transition text-sm"
                  >
                    إرسال
                  </button>
                </form>
              </>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50 italic">
                    <i className="fas fa-comment-dots text-5xl mb-4 opacity-10"></i>
                    <p>اختر محادثة للبدء</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyChats;
