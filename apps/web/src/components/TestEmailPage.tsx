import { useState } from 'react';
import { ArrowLeft, Mail, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';

export const TestEmailPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSendTest = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-gray-400 w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 sm:w-5 sm:h-5" />
        </Button>
        <h2 className="text-base sm:text-lg font-light text-gray-900 tracking-wide">
          Test Email
        </h2>
        <div className="w-12 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Info Box */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
            <h3 className="font-medium text-cyan-900 mb-2">📧 Email Test</h3>
            <p className="text-sm text-cyan-700">
              This will send a mock order confirmation email to the address you enter below and to the configured owner email.
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Test Email Address</label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl"
              disabled={isSending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700">Test emails sent successfully! Check your inbox.</p>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendTest}
            disabled={isSending}
            variant="gradient"
            className="w-full shadow-lg"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestEmailPage;

