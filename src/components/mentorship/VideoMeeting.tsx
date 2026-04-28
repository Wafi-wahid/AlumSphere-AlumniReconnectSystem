import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function VideoMeeting() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // Load Jitsi Meet External API
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.JitsiMeetExternalAPI !== 'undefined' && containerRef.current) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomId,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            enableUserRolesBasedOnToken: false,
            disableModeratorIndicator: true,
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_WATERMARK: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        // Handle meeting end
        api.addEventProperties({
          'participantLeft': () => {
            // Optional: handle participant left
          },
          'conferenceEnded': () => {
            navigate('/mentorship');
          },
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [roomId, navigate]);

  return (
    <div className="h-screen w-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
