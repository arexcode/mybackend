import { NavBar } from "../components";

export function MainLayout({ children }){
    return(
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
                { children }
            </main>

        </div>
    )
}