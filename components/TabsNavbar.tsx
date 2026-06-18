'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, CircleHelp, GraduationCap, MessageCircle } from 'lucide-react';

const tabs = [
  { id: 'aprender', label: 'Comenzar a aprender', icon: BookOpen },
  { id: 'elegir', label: 'Por qué elegir SABERHUB', icon: CircleHelp },
  { id: 'ensenar', label: 'Enseña con SABERHUB', icon: GraduationCap },
  { id: 'faq', label: 'Preguntas frecuentes', icon: MessageCircle },
];

export default function TabsNavbar() {
  const [activeTab, setActiveTab] = useState('aprender');

  useEffect(() => {
    const callback = (entries: IntersectionObserverEntry[]) => {
      // Find the entry that is intersecting the most or highest on page
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by how high they are on the page to highlight the uppermost visible one
        visibleEntries.sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        setActiveTab(visibleEntries[0].target.id);
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -40% 0px',
      threshold: [0.05, 0.1, 0.2],
    });

    tabs.forEach((tab) => {
      const element = document.getElementById(tab.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 144; // sticky header (80px) + tabs navbar (58px) + a bit of padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      
      setActiveTab(id);
    }
  };

  return (
    <nav className="sticky top-[80px] z-40 border-y border-[#E5E7EB] bg-white px-6 lg:px-8 shadow-sm">
      <div className="mx-auto flex max-w-[1180px] gap-10 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              onClick={(e) => handleScroll(e, tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 py-4 text-sm font-semibold transition-all duration-200 no-underline ${
                isActive
                  ? 'border-[#2563EB] text-[#2563EB] scale-102'
                  : 'border-transparent text-[#4B5563] hover:text-[#2563EB]'
              }`}
            >
              <TabIcon size={16} className={`transition-colors ${isActive ? 'text-[#2563EB]' : 'text-[#6B7280]'}`} />
              {tab.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
