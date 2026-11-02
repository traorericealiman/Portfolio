import { motion } from 'framer-motion';
import { useContent } from '../lib/contentStore';
import { recordWhatsappClick } from '../lib/analytics';

export default function FloatingWhatsApp() {
  const { profile } = useContent();
  const phoneDigits = profile.phone.replace(/[^0-9]/g, '');

  return (
    <motion.a
      href={`https://wa.me/${phoneDigits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      onClick={() => recordWhatsappClick()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{ marginBottom: 'env(safe-area-inset-bottom)', marginRight: 'env(safe-area-inset-right)' }}
      className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-[90] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] shadow-lg shadow-black/20 flex items-center justify-center hover:shadow-xl transition-shadow"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40" />
      <svg
        viewBox="0 0 32 32"
        className="relative w-7 h-7 sm:w-8 sm:h-8 fill-white"
        aria-hidden="true"
      >
        <path d="M16.004 2.667c-7.364 0-13.337 5.973-13.337 13.337 0 2.353.615 4.66 1.784 6.693L2.667 29.333l6.797-1.783a13.29 13.29 0 0 0 6.54 1.667h.006c7.364 0 13.337-5.973 13.337-13.337S23.368 2.667 16.004 2.667zm0 24.4h-.005a11.06 11.06 0 0 1-5.638-1.543l-.405-.24-4.033 1.058 1.077-3.93-.264-.404a11.04 11.04 0 0 1-1.696-5.894c0-6.102 4.964-11.066 11.07-11.066 2.957 0 5.735 1.153 7.826 3.245a10.99 10.99 0 0 1 3.238 7.826c0 6.102-4.966 11.068-11.07 11.068zm6.067-8.288c-.332-.166-1.965-.97-2.27-1.08-.305-.11-.526-.166-.748.166-.222.333-.86 1.08-1.054 1.302-.194.222-.388.25-.72.083-.332-.166-1.402-.517-2.67-1.65-.987-.881-1.653-1.968-1.847-2.3-.194-.333-.02-.512.146-.678.15-.15.332-.388.498-.583.166-.194.222-.333.332-.555.11-.222.055-.416-.028-.583-.083-.166-.748-1.804-1.025-2.47-.27-.65-.545-.562-.748-.573l-.637-.011c-.222 0-.583.083-.888.416-.305.333-1.164 1.138-1.164 2.775 0 1.637 1.192 3.22 1.358 3.442.166.222 2.347 3.583 5.686 5.024.795.343 1.415.548 1.898.702.797.253 1.523.217 2.097.132.64-.096 1.965-.803 2.242-1.58.277-.777.277-1.442.194-1.58-.083-.138-.305-.222-.637-.388z" />
      </svg>
    </motion.a>
  );
}
