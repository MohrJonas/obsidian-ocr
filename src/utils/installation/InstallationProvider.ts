import {Terminal} from "xterm";

interface InstallationProvider {

    installDependencies(terminal: Terminal): void;

    isApplicable(): Promise<boolean>

}

export default InstallationProvider;