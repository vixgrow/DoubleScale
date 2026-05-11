import { Col, Row, Skeleton, Space } from 'antd';

const ShimmerLoader = () => {
	return (
		<div
			style={{
				margin: 'auto',
				padding: 24,
				background: '#fff',
			}}
		>
			<Row align="middle" gutter={16}>
				<Col>
					<Skeleton.Avatar active size="large" shape="circle" />
				</Col>
			</Row>

			<div style={{ marginTop: 24 }}>
				<Space direction="vertical" size={16} style={{ width: '100%' }}>
					<Skeleton.Input
						active
						size="default"
						style={{ width: '70%' }}
					/>
					<Skeleton.Input
						active
						size="small"
						style={{ width: '90%' }}
					/>
					<Skeleton.Input
						active
						size="small"
						style={{ width: '80%' }}
					/>
				</Space>
			</div>

			<div style={{ marginTop: 32 }}>
				<Skeleton.Input
					active
					block
					style={{ height: 200, borderRadius: 8 }}
				/>
			</div>

			<Row gutter={16} style={{ marginTop: 24 }}>
				<Col span={6}>
					<Skeleton.Input active style={{ width: '50%' }} />
				</Col>
			</Row>
		</div>
	);
};

export default ShimmerLoader;
