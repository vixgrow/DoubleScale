/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Input, Card, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useContactContext } from '../state/context';

const Profile: React.FC = () => {
	const { setContact, updateContact, isLoading, isUpdating, contact } =
		useContactContext();
	return (
		<Card loading={isLoading}>
			{contact && (
				<>
					<div className="qcrm-contact-profile">
						<div className="qcrm-contact-profile-fields qcrm-fields">
							<Typography.Title level={4}>
								{__('Contact Details', 'quillcrm')}
							</Typography.Title>
							<div className="qcrm-field qcrm-field-group">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('First Name', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.first_name}
											onChange={(e) => {
												setContact({
													...contact,
													first_name: e.target.value,
												});
											}}
										/>
									</div>
								</div>
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Last Name', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.last_name}
											onChange={(e) => {
												setContact({
													...contact,
													last_name: e.target.value,
												});
											}}
										/>
									</div>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Email', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={contact.email}
										onChange={(e) => {
											setContact({
												...contact,
												email: e.target.value,
											});
										}}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Phone', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={contact.phone}
										onChange={(e) => {
											setContact({
												...contact,
												phone: e.target.value,
											});
										}}
									/>
								</div>
							</div>
						</div>
						<div className="qcrm-contact-address qcrm-fields">
							<Typography.Title
								level={4}
								className="qcrm-contact-profile-title"
							>
								{__('Address', 'quillcrm')}
							</Typography.Title>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 1', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={contact.address_1}
										onChange={(e) => {
											setContact({
												...contact,
												address_1: e.target.value,
											});
										}}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 2', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={contact.address_2}
										onChange={(e) => {
											setContact({
												...contact,
												address_2: e.target.value,
											});
										}}
									/>
								</div>
							</div>
							<div className="qcrm-field qcrm-field-group">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('City', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.city}
											onChange={(e) => {
												setContact({
													...contact,
													city: e.target.value,
												});
											}}
										/>
									</div>
								</div>
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('State', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.state}
											onChange={(e) => {
												setContact({
													...contact,
													state: e.target.value,
												});
											}}
										/>
									</div>
								</div>
							</div>
							<div className="qcrm-field qcrm-field-group">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Country', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.country}
											onChange={(e) => {
												setContact({
													...contact,
													country: e.target.value,
												});
											}}
										/>
									</div>
								</div>
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Zip', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Input
											value={contact.zip}
											onChange={(e) => {
												setContact({
													...contact,
													zip: e.target.value,
												});
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<Button
						onClick={() => updateContact()}
						type="primary"
						loading={isUpdating}
					>
						{__('Update Contact', 'quillcrm')}
					</Button>
				</>
			)}
		</Card>
	);
};

export default Profile;
