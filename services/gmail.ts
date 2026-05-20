export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
  };
}

export const gmailService = {
  sendEmail: async (to: string, subject: string, message: string) => {
    console.log('Mock Email Sending:', { to, subject, message });
    return { status: 'sent' };
  },

  listMessages: async (maxResults = 10) => {
    return [
      { id: '1', threadId: '1', snippet: 'مرحباً، هل المنتج لا يزال متوفراً؟', payload: { headers: [{ name: 'Subject', value: 'استفسار عن إعلان' }, { name: 'From', value: 'Ahmad <ahmad@example.com>' }] } },
      { id: '2', threadId: '2', snippet: 'تم تأكيد طلبك بنجاح', payload: { headers: [{ name: 'Subject', value: 'تأكيد طلب' }, { name: 'From', value: 'Waseet Plus <noreply@waseet.com>' }] } },
    ] as GmailMessage[];
  },
};
