full tech stack for this project:

  Layer   
  Technology =  Purpose  

   Frontend Framework    
   React 19 + TypeScript 5.8 =  UI components & logic  
-------------------------------------------------------------------------------
   Build Tool    
   Vite 8 =  Dev server & bundling  
-------------------------------------------------------------------------------
   Styling    
   Tailwind CSS 4   = Utility-first CSS framework 
------------------------------------------------------------------------------- 
   Animation    
   Motion (Framer Motion) 12 + Anime.js 4  = Page animations & micro-interactions
-------------------------------------------------------------------------------
   Icons    
   Lucide React =  SVG icon set
-------------------------------------------------------------------------------  
   Routing    
   React Router DOM 7  = Client-side navigation 
------------------------------------------------------------------------------- 
   Auth (Client)    
   @react-oauth/google   = Google OAuth button & flow 
------------------------------------------------------------------------------- 
   API Layer    
   Vite proxy → Express backend  = Proxy `/api` to backend server  
-------------------------------------------------------------------------------
   Backend Framework    
   Express 4.21 =  REST API server  
-------------------------------------------------------------------------------
   Runtime    
   Node.js via tsx watch  = TypeScript execution for server  
-------------------------------------------------------------------------------
   Database    
   SQLite (better-sqlite3) =  Embedded relational DB  
-------------------------------------------------------------------------------
   Auth (Server)    
   bcryptjs + jsonwebtoken =  Password hashing & JWT tokens 
------------------------------------------------------------------------------- 
   Validation    
   Zod 4  = Schema validation (API payloads)  
-------------------------------------------------------------------------------
   Security    
   Helmet + express-rate-limit + cors =  HTTP headers, rate limiting, CORS  
-------------------------------------------------------------------------------
   File Uploads    
   Multer =  Image/file upload handling  
-------------------------------------------------------------------------------
   Email    
   Nodemailer + SendGrid  = Order notifications  
-------------------------------------------------------------------------------
   Password Hashing    
   bcryptjs = Secure password storage  
-------------------------------------------------------------------------------
   Middleware    
   cookie-parser  = JWT cookie management  
-------------------------------------------------------------------------------
   Dev Tools    
   concurrently  = Run client + server in one command  
-------------------------------------------------------------------------------


 Architecture:  Monorepo with `vite dev` on port  3000  (frontend) proxying `/api` to the Express server on port  3001  (backend). The SQLite database (`loudlayer.db`) is local file-based.