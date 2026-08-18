"use client";

import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";
import "./GlassIcons.css";

export interface GlassIconsItem {
  icon: ReactElement;
  color: string;
  label: string;
  href: string;
  customClass?: string;
}

export interface GlassIconsProps {
  items: GlassIconsItem[];
  className?: string;
}

export default function GlassIcons({ items, className = "" }: GlassIconsProps) {
  return (
    <div className={`icon-btns${className ? ` ${className}` : ""}`} role="list">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`icon-btn${item.customClass ? ` ${item.customClass}` : ""}`}
          aria-label={item.label}
          role="listitem"
        >
          <span
            className="icon-btn__back"
            style={{ background: item.color } as CSSProperties}
            aria-hidden="true"
          />
          <span className="icon-btn__front">
            <span className="icon-btn__icon">{item.icon}</span>
          </span>
          <span className="icon-btn__label">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
