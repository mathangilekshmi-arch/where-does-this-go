import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Where Does This Go? — Make room for what’s next', description: 'Give your things a next chapter. A simple personal planner to sell, donate, give away, or recycle what you no longer need.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
