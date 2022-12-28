import {Terminal} from "xterm";

/**
 * Base interface to installation providers
 * */
interface InstallationProvider {

    /**
     * Install the required dependencies
     * @param terminal A terminal, allowing for displaying of progress / errors
     * */
    installDependencies(terminal: Terminal): void;

    /**
     * Check if this provider is usable on the current platform
     * @description This could always return true, or depend on the operating system, package manager,...
     * */
    isApplicable(): Promise<boolean>

}

export default InstallationProvider;