import { NavBar } from "../components";

export function MainLayout({ children }){
    return(
        <>
        <NavBar />
        { children }
        </>
    )
}