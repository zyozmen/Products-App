import {useParams } from "react-router-dom";
 
function paramsComponent(Component) {
  return props => <Component {...props} params={useParams()} />;
}
 
export default paramsComponent;