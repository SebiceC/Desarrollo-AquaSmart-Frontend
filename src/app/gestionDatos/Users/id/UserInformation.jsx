import React from "react";
import NavBar from "../../../../components/NavBar";
import { FaUser, FaPhone, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";
import { MdDownload } from "react-icons/md";

function UserInformation() {
  return (
    <div className="w-full min-h-screen bg-white">
      <NavBar />
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] mt-16">
        <div className="bg-gray-200 rounded-2xl p-8 shadow-md w-[35%] text-center relative">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <FaUser size={70} className="text-gray-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Jhon Pulido
            </h2>
            <p className="text-gray-700 font-semibold">ID: 54545454</p>
          </div>

          <div className="mt-12 flex justify-center gap-20">
            <div className="space-y-3 text-left">
              <p className="flex items-center space-x-2">
                <FaUser className="text-gray-600" />
                <span>Persona natural</span>
              </p>
              <p className="flex items-center space-x-2">
                <FaPhone className="text-gray-600" />
                <span>+57 3105602354</span>
              </p>
              <p className="flex items-center space-x-2">
                <FaEnvelope className="text-gray-600" />
                <span>williancamacho@gmail.com</span>
              </p>
            </div>

            {/* Anexos */}
            <div className="text-left">
              <p className="flex items-center font-semibold">
                <IoDocument className="text-gray-600 mr-2" /> Anexos
              </p>
              <div className="mt-2 space-y-2">
                {["anexo1.pdf", "anexo2.pdf", "anexo3.pdf"].map(
                  (file, index) => (
                    <p
                      key={index}
                      className="flex items-center space-x-2 text-blue-600 cursor-pointer"
                    >
                      <span>{file}</span>
                      <MdDownload className="text-gray-600" />
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserInformation;
