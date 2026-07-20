import { useCoordinateContext } from '../context/CoordinateContext';

export function useCoordinates() {
  return useCoordinateContext();
}
export default useCoordinates;
