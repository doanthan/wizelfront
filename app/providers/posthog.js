'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Disable automatic pageview capture, we'll do it manually
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'], // Capture only specific events
      element_allowlist: ['button', 'input', 'select', 'textarea', 'a'],
    },
    session_recording: {
      maskAllInputs: true, // Mask sensitive inputs
      maskTextContent: false,
    },
    loaded: (posthog) => {
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
        posthog.debug();
      }
    },
  });
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PHProvider({ children }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}