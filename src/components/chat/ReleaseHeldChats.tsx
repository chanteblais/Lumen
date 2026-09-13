"use client";

import { useEffect } from "react";
import { releaseHeldChats } from "./chat-client";

/** On the sign-in and sign-up pages: whoever signs in next starts with no held chat (`releaseHeldChats`). */
export function ReleaseHeldChats() {
  useEffect(() => {
    releaseHeldChats();
  }, []);
  return null;
}
