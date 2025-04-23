import { NavBar } from "../components";
import { MainLayout } from "../layouts";
import { ProjectDetailsView } from "../views/ProjectDetailsView";

export function ProjectDetailsPage(){
    return(
        <MainLayout>
            <ProjectDetailsView /> 
        </MainLayout>
    )
} 