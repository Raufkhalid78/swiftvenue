"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import React from "react";

export function FramerMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
