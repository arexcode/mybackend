import { Link } from "react-router-dom";

export function NavBar() {
    return (
        <nav className="bg-black shadow-lg">
            <div className="flex justify-around items-center h-20">
                <div>
                    <h4 className="text-white text-xl font-semibold"> DIGITAL BUHO S.A.C </h4>
                </div>
                <div>
                    <li>
                        {/* <Link className="text-white font-normal" to={''}> Inicio </Link> */}
                    </li>
                </div>
            </div>
        </nav>
    );
}