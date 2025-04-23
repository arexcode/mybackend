import { NavBar } from "../components";
import { MainLayout } from "../layouts";
import { HomeView } from "../views";

export function HomePage(){
    return(
        <MainLayout>
            <HomeView /> 
        </MainLayout>
    )
}