import { 
    Brain
  } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
function Header() {
    const menuRef = useRef(null)
    useEffect(()=>{
        gsap.fromTo(menuRef.current.children, 
            {opacity: 0, y: -20},
            {opacity: 1, y: 0, duration: 1, delay: 1, stagger: 0.5}
        )
    })
    return (
        <header className="bg-white border-b">
            <div className="mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Brain className="w-8 h-8 text-indigo-600" />
                        <span className="text-2xl font-bold">Smart Grade</span>
                    </div>
                    <nav className="hidden md:flex space-x-20" ref={menuRef}>
                        {/* <Link to={'home'} className="font-semibold text-lg text-gray-600 hover:text-indigo-600">
                        Dashboard
                        </Link>
                        <Link to={'login'} className="font-semibold text-lg text-gray-600 hover:text-indigo-600">
                        Login
                        </Link>
                        <Link to={'signup'} className="font-semibold text-lg text-gray-600 hover:text-indigo-600">
                        Sign Up
                        </Link> */}
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;
