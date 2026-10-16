import { useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
 
// `auth` es null si el componente se renderiza fuera de <AuthProvider>.
function navigationComponent(Component) {
  return props => <Component {...props} navigate={useNavigate()} params={useParams()} location={useLocation()} auth={useContext(AuthContext)} />;
}
 
export default navigationComponent;