import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, ArrowRight, Flame, Leaf } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "The dumplings arrived still steaming, folded like little love letters. I didn't order dinner — I ordered a memory of my grandmother's kitchen.",
    name: 'Mara Okonkwo',
    detail: 'Ordered from Lantern & Clay · Brooklyn',
    dish: 'Hand-pinched pork & chive dumplings',
    time: '23 min door to door',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces',
    food:
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=900&h=600&fit=crop',
    note: 'still steaming!',
    accent: '#FFB347',
  },
  {
    id: 2,
    quote:
      "Rainy Tuesday, deadline at midnight, and a bowl of khao soi shows up glowing like a lantern. Ember doesn't deliver food. It delivers small rescues.",
    name: 'Theo Vasquez',
    detail: 'Ordered from Night Market 9 · Portland',
    dish: 'Khao soi with crispy noodle crown',
    time: '31 min door to door',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces',
    food:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900&h=600&fit=crop',
    note: 'a small rescue',
    accent: '#9CCB6B',
  },
  {
    id: 3,
    quote:
      "My daughter drew the courier a thank-you card. He waited while she finished it. That's the kind of company you tell people about at parties.",
    name: 'June Halvorsen',
    detail: 'Ordered from Bread & Bramble · Minneapolis',
    dish: 'Wood-fired sourdough margherita',
    time: '27 min door to door',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces',
    food:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&h=600&fit=crop',
    note: 'worth the wait',
    accent: '#F08C5A',
  },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const t = TESTIMONIALS[index];

  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);
  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div className="ember-root min-h-screen w-full flex items-center justify-center px-5 py-14 bg-[#15110D]">
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Caveat:wght@500;600&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ember-root {
          font-family: 'Inter', sans-serif;
          position: relative;
          background-color: #15110D;
          background-image: radial-gradient(ellipse 90% 70% at 50% -10%, rgba(255,179,71,0.07), transparent 60%);
        }
        .ember-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
        }
        .serif { font-family: 'Fraunces', serif; }
        .hand { font-family: 'Caveat', cursive; }
        .card-edge {
          border-radius: 28px 22px 30px 24px;
        }
        .photo-frame {
          border-radius: 18px 60px 18px 18px;
        }
        .stamp {
          border: 1.5px dashed rgba(255,179,71,0.45);
          border-radius: 50%;
          transform: rotate(-8deg);
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(0.92); }
        }
        .flame-flicker { animation: flicker 2.4s ease-in-out infinite; }
        .quote-mark {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-style: italic;
          line-height: 0.6;
        }
        .nav-btn {
          transition: all 0.25s ease;
        }
        .nav-btn:hover {
          background: rgba(255,179,71,0.12);
          border-color: rgba(255,179,71,0.5);
          transform: translateY(-1px);
        }
        .dot-btn { transition: all 0.3s ease; }
      `,
        }}
      />

      <div className="w-full max-w-[640px] relative z-10">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2.5 mb-9">
          <span className="flame-flicker inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFB347]/15 border border-[#FFB347]/30">
            <Flame size={15} className="text-[#FFB347]" strokeWidth={2.2} />
          </span>
          <span className="serif text-[#EFE6D8] text-lg tracking-wide font-medium">
            ember<span className="text-[#FFB347]">.</span>
          </span>
          <span className="text-[#8C8071] text-[11px] uppercase tracking-[0.22em] mt-0.5 ml-1">
            stories from the doorstep
          </span>
        </div>

        {/* Card */}
        <div className="card-edge relative bg-[#211B14] border border-[#3A3023] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,179,71,0.04)] overflow-hidden">
          {/* warm top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 30% 0%, ${t.accent}14, transparent 70%)`,
              transition: 'background 0.6s ease',
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-8 sm:px-12 pt-10 pb-9"
            >
              {/* Quote mark + stars */}
              <div className="flex items-start justify-between mb-5">
                <span
                  className="quote-mark text-[88px] select-none"
                  style={{ color: t.accent }}
                >
                  “
                </span>
                <div className="flex flex-col items-end gap-1.5 pt-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className="text-[#FFB347]"
                        fill="#FFB347"
                        strokeWidth={1.5}
                        style={{ transform: `rotate(${(i % 2 ? -1 : 1) * 6}deg)` }}
                      />
                    ))}
                  </div>
                  <span className="hand text-[#A89A86] text-lg leading-none -rotate-2">
                    five out of five, easily
                  </span>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="serif text-[#F2E9DA] text-[26px] sm:text-[30px] leading-[1.32] font-light -mt-8">
                {t.quote.split(' ').map((word, i) => {
                  const highlight =
                    t.note.toLowerCase().includes(word.toLowerCase().replace(/[^a-z]/g, '')) &&
                    word.length > 3;
                  return (
                    <span key={i} className={highlight ? 'italic font-normal' : ''} style={highlight ? { color: t.accent } : {}}>
                      {word}{' '}
                    </span>
                  );
                })}
              </blockquote>

              {/* Photo strip + handwritten note */}
              <div className="flex items-end gap-5 mt-8">
                <div className="relative shrink-0">
                  <img
                    src={t.food}
                    alt={t.dish}
                    className="photo-frame w-[180px] h-[124px] object-cover border border-[#4A3D2C]"
                  />
                  <div className="absolute -bottom-3 -right-3 stamp w-[58px] h-[58px] flex items-center justify-center bg-[#211B14]">
                    <Leaf size={14} className="text-[#9CCB6B] -rotate-12" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <p className="hand text-[24px] leading-tight -rotate-1" style={{ color: t.accent }}>
                    “{t.note}”
                  </p>
                  <svg width="110" height="14" viewBox="0 0 110 14" className="-rotate-1 mt-1 opacity-70">
                    <path
                      d="M2 9 C 22 3, 40 12, 58 7 S 95 4, 108 8"
                      fill="none"
                      stroke={t.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-[#8C8071] text-[12px] mt-3 leading-relaxed">
                    {t.dish}
                    <span className="block text-[#5F5546] mt-0.5">{t.time}</span>
                  </p>
                </div>
              </div>

              {/* Attribution */}
              <div className="mt-9 pt-6 border-t border-dashed border-[#3F3526] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    style={{ borderColor: t.accent }}
                  />
                  <div>
                    <p className="serif text-[#EFE6D8] text-[17px] font-medium leading-tight">
                      {t.name}
                    </p>
                    <p className="text-[#8C8071] text-[12px] mt-0.5">{t.detail}</p>
                  </div>
                </div>
                <span
                  className="hidden sm:inline-block text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border"
                  style={{ color: t.accent, borderColor: `${t.accent}55`, background: `${t.accent}10` }}
                >
                  Verified order
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-7 px-1">
          <button
            onClick={prev}
            className="nav-btn w-10 h-10 rounded-full border border-[#3A3023] flex items-center justify-center text-[#A89A86]"
            aria-label="Previous story"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            {TESTIMONIALS.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Story ${i + 1}`}
                className="dot-btn rounded-full"
                style={{
                  width: i === index ? 26 : 8,
                  height: 8,
                  background: i === index ? item.accent : '#4A3D2C',
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="nav-btn w-10 h-10 rounded-full border border-[#3A3023] flex items-center justify-center text-[#A89A86]"
            aria-label="Next story"
          >
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-center text-[#5F5546] text-[11px] tracking-[0.2em] uppercase mt-7">
          12,408 doorstep stories and counting
        </p>
      </div>
    </div>
  );
}