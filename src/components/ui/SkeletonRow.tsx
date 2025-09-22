export default function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-3 border border-gray-200">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </td>
      <td className="p-3 border border-gray-200">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </td>
      <td className="p-3 border border-gray-200">
        <div className="h-4 w-12 bg-gray-200 rounded"></div>
      </td>
      <td className="p-3 border border-gray-200">
        <div className="h-4 w-28 bg-gray-200 rounded"></div>
      </td>
      <td className="p-3 border border-gray-200">
        <div className="h-4 w-28 bg-gray-200 rounded"></div>
      </td>
    </tr>
  );
}
