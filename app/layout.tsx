import "./globals.css"; import type {Metadata} from "next";
export const metadata:Metadata={title:"OfficeFlow Pro",description:"Office Task & Delivery Management"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}