import { Link } from 'react-router-dom';

export default function Home(){
    return(
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-2xl text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              CodeMap 🗺️
            </h1>
            <p className="text-xl text-slate-300 mb-10">
               Paste a GitHub URL. Get an AI-powered explanation of the codebase in seconds.
            </p>
            <div className="flex gap-4 justify-center">
               <Link
                 to="/login"
                 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                 >
                  Login
               </Link>
               <Link
                 to="/signup"
                 className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition"
                 >
                  
                  Sign Up
               </Link>
            </div>
          </div>
        </div>
    );
}