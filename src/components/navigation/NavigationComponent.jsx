import { useLocation, useNavigate, useParams } from "react-router-dom";
 
function navigationComponent(Component) {
  return props => <Component {...props} navigate={useNavigate()} params={useParams()} location={useLocation()} />;
}
 
export default navigationComponent;