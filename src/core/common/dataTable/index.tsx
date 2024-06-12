// index.tsx
import React, { useState } from "react";
import { Table } from "antd";
import { DatatableProps } from "../../data/interface"; // Ensure correct path

const Datatable: React.FC<DatatableProps> = ({ columns, dataSource }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);

  const onSelectChange = (newSelectedRowKeys: any[]) => {
    console.log("selectedRowKeys changed: ", selectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <Table
      className="table datanew dataTable no-footer"
      rowSelection={rowSelection}
      columns={columns}
      dataSource={dataSource}
       // Assuming `id` is the unique identifier of each record
    />
  );
};

export default Datatable;
