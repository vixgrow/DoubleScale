import React from 'react'
import { all_routes } from '../router/all_routes'
import CollapseHeader from '../../core/common/collapse-header';

const BlankPage = () => {

  return (

   <div className="page-wrapper">
  <div className="content">
    <div className="row">
      <div className="col-md-12">
        <div className="page-header">
          <div className="row align-items-center ">
            <div className="col-8">
              <h3 className="page-title">Blank Page</h3>
            </div>
            <div className="col-4 text-sm-end">
              <div className="title-head">
                <div className="head-icons">
                  <CollapseHeader />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>



  )
}

export default BlankPage